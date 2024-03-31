(module(import "env" "memory" (memory $0 1))(func $print (import "env" "print") (param i32))
  (func $input (import "env" "input") (result i32))
  (func $sleep (import "env" "sleep") (param i32))
  (func $random (import "env" "random") (result f64))
  (func $allocate_memory (import "env" "allocate_memory") (param i32) (result i32))
  (func $deallocate_memory (import "env" "deallocate_memory") (param i32) (param i32))
  (export "string_ini" (func $string_ini))
  (export "string_ini_assign" (func $string_ini_assign))
  (global $mem (mut i32) (i32.const 0))
  (global $tmp (mut i32) (i32.const 0))
;; (data (i32.const 4) "f   e ")
;;  (func $allocate_memory (param $size i32) (result i32)
;;     (local $tmpOffset i32)
    
;;     global.get $offset
;;     local.set $tmpOffset
    
;;     global.get $offset
;;     local.get $size
;;     i32.add
;;     global.set $offset
    
;;     local.get $tmpOffset
;;   )

  (func $check_in_bounds (param $arr i32) (param $index i32)
    local.get $index
    i32.const 0
    i32.lt_s
    local.get $index
    local.get $arr
    call $length
    i32.ge_s
    i32.or
    if
      unreachable
    end
  )
  
  
  (func $check_if_null (param $struct i32) (result i32)
    local.get $struct
    i32.eqz
    if
      unreachable
    end
    
    local.get $struct
    return
  )

  (func $itod (param $num i32) (result f64)
    local.get $num
    f64.convert_i32_s
    return
  )
  
  (func $dtoi (param $num f64) (result i32)
    local.get $num
    i32.trunc_f64_s
    return
  )
  
  (func $length (param $arr i32) (result i32)
    local.get $arr
    i32.const 4
    i32.sub
    i32.load
  )
  
  (func $length_string (param $arr i32) (result i32)
    (local $tmpLength i32)
    
    local.get $arr
    call $length
    local.set $tmpLength
    
    local.get $arr
    call $delete_string
    
    local.get $tmpLength
  )
  
  (func $error (param $str_array i32)
    unreachable
  )
  
  (func $get_array_pointer (param $arr i32) (result i32)
    local.get $arr
  )
  
  (func $array_int_to_string (param $arr i32) (result i32)
    local.get $arr
  )
  
  (func $string_to_array_int (param $arr i32) (result i32)
    local.get $arr
  )
  
  (func $delete_i32_array (param $delete_i32_array0_arr i32)
    local.get $delete_i32_array0_arr
    call $get_array_pointer
    i32.const 4
    i32.sub
    i32.const 4
    local.get $delete_i32_array0_arr
    call $length
    i32.const 1
    i32.add
    i32.mul
    call $deallocate_memory
    i32.const 0
    return
  )

  (func $delete_string (param $delete_string0_str i32)
    local.get $delete_string0_str
    call $delete_i32_array
  )
  
  (func $string_ini_assign (param $array i32) (param $index i32) (param $value i32) (result i32)    
    local.get $array
    local.get $index
    i32.const 4
    i32.mul
    i32.add
    local.get $value
    i32.store

    local.get $array
    return
  )

  (func $string_ini (param $length i32) (result i32)
    (local $totalBytes i32)
    (local $tmpOffset i32)

    i32.const 4
    i32.const 4
    local.get $length
    i32.mul
    i32.add
    local.set $totalBytes

    local.get $totalBytes
    call $allocate_memory
    local.set $tmpOffset

    local.get $tmpOffset
    local.get $length
    i32.store

    local.get $tmpOffset
    i32.const 4
    i32.add
    
    return
  )
  
  (func $copy_string (param $copy_string0_str i32) (result i32)
   (local $copy_string0_str_length i32)
   (local $copy_string0_tmpOffset i32)

    local.get $copy_string0_str
    call $length
    local.set $copy_string0_str_length

    local.get $copy_string0_str_length
    i32.const 4
    i32.mul
    i32.const 4
    i32.add
    call $allocate_memory
    local.set $copy_string0_tmpOffset

    local.get $copy_string0_tmpOffset
    local.get $copy_string0_str
    call $get_array_pointer
    i32.const 4
    i32.sub
    local.get $copy_string0_str_length
    i32.const 4
    i32.mul
    i32.const 4
    i32.add
    memory.copy

    local.get $copy_string0_tmpOffset
    i32.const 4
    i32.add
    return
    i32.const 0
    return
  )

  (func $string_concat (param $string_concat0_string_1 i32) (param $string_concat0_string_2 i32) (result i32)
   (local $string_concat0_length_1 i32)
   (local $string_concat0_length_2 i32)
   (local $string_concat0_new_length i32)
   (local $string_concat0_new_string i32)

    local.get $string_concat0_string_1
    call $length
    local.set $string_concat0_length_1

    local.get $string_concat0_string_2
    call $length
    local.set $string_concat0_length_2

    local.get $string_concat0_length_1
    local.get $string_concat0_length_2
    i32.add
    local.set $string_concat0_new_length

    local.get $string_concat0_new_length
    call $string_ini
    local.set $string_concat0_new_string

    local.get $string_concat0_new_string
    local.get $string_concat0_string_1
    local.get $string_concat0_length_1
    i32.const 4
    i32.mul
    memory.copy

    local.get $string_concat0_new_string
    local.get $string_concat0_length_1
    i32.const 4
    i32.mul
    i32.add
    local.get $string_concat0_string_2
    local.get $string_concat0_length_2
    i32.const 4
    i32.mul
    memory.copy

    local.get $string_concat0_string_1
    i32.const 4
    i32.sub
    local.get $string_concat0_length_1
    i32.const 4
    i32.mul
    i32.const 4
    i32.add
    call $deallocate_memory

    local.get $string_concat0_string_2
    i32.const 4
    i32.sub
    local.get $string_concat0_length_2
    i32.const 4
    i32.mul
    i32.const 4
    i32.add
    call $deallocate_memory

    local.get $string_concat0_new_string
    return
    i32.const 0
    return
  )
  
  (func $itos (param $itos_0_val i32) (result i32)
   (local $size i32)
   (local $val i32)
   (local $result i32)
   (local $i i32)

    i32.const 0
    local.set $size

    local.get $itos_0_val
    local.set $val

    (loop $loop1
      local.get $val
      i32.const 10
      i32.div_s
      local.set $val
      local.get $size
      i32.const 1
      i32.add
      local.set $size
      local.get $val
      i32.const 0
      i32.gt_s
      br_if $loop1
    )

    local.get $itos_0_val
    local.set $val

    local.get $size
    call $i32_new_array
    local.set $result

    local.get $size
    i32.const 1
    i32.sub
    local.set $i
    (loop $loop2
      i32.const 48
      local.get $val
      i32.const 10
      i32.rem_s
      i32.add
      local.get $i
      local.get $result
      call $i32_set_array_elem
      local.get $val
      i32.const 10
      i32.div_s
      local.set $val
      local.get $i
      i32.const 1
      i32.sub
      local.set $i
      local.get $i
      i32.const 0
      i32.ge_s
      br_if $loop2
    )

    local.get $result
    return
  )
  
  
  (func $dtos (param $dtos_0_d f64) (result i32)
   (local $dtos_0_precision i32)
   (local $dtos_0_total_length i32)
   (local $dtos_0_is_neg i32)
   (local $dtos_0_int_part i32)
   (local $dtos_0_int_length i32)
   (local $dtos_0_offset i32)
   (local $dtos_0_fract_part f64)
   (local $dtos_0_result i32)
   (local $dtos__for1_i i32)
   (local $dtos__for2_i i32)
   (local $dtos__for2_digit i32)
   (local $tmpString i32)

    i32.const 10
    local.set $dtos_0_precision

    local.get $dtos_0_precision
    i32.const 1
    i32.add
    local.set $dtos_0_total_length

    local.get $dtos_0_d
    f64.const 0.0
    f64.lt
    local.set $dtos_0_is_neg

    local.get $dtos_0_is_neg
    if
      local.get $dtos_0_total_length
      i32.const 1
      i32.add
      local.set $dtos_0_total_length
      local.get $dtos_0_d
      f64.const 0.0
      f64.const 1.0
      f64.sub
      f64.mul
      local.set $dtos_0_d
    end

    local.get $dtos_0_d
    call $dtoi
    call $itos
    local.tee $tmpString
    call $string_to_array_int
    local.set $dtos_0_int_part

    local.get $dtos_0_int_part
    call $length
    local.set $dtos_0_int_length

    i32.const 0
    local.set $dtos_0_offset

    local.get $dtos_0_total_length
    local.get $dtos_0_int_length
    i32.add
    local.set $dtos_0_total_length

    local.get $dtos_0_d
    local.get $dtos_0_d
    call $dtoi
    call $itod
    f64.sub
    local.set $dtos_0_fract_part

    local.get $dtos_0_total_length
    call $i32_new_array
    local.set $dtos_0_result

    local.get $dtos_0_is_neg
    if
      i32.const 45
      local.get $dtos_0_offset
      local.get $dtos_0_result
      call $i32_set_array_elem
      local.get $dtos_0_offset
      i32.const 1
      i32.add
      local.set $dtos_0_offset
    end

    i32.const 0
    local.set $dtos__for1_i
    (loop $loop1
      local.get $dtos__for1_i
      local.get $dtos_0_int_part
      call $i32_get_array_elem
      local.get $dtos_0_offset
      local.get $dtos_0_result
      call $i32_set_array_elem
      local.get $dtos_0_offset
      i32.const 1
      i32.add
      local.set $dtos_0_offset
      local.get $dtos__for1_i
      i32.const 1
      i32.add
      local.set $dtos__for1_i
      local.get $dtos__for1_i
      local.get $dtos_0_int_length
      i32.lt_s
      br_if $loop1
    )

    i32.const 46
    local.get $dtos_0_offset
    local.get $dtos_0_result
    call $i32_set_array_elem

    local.get $dtos_0_offset
    i32.const 1
    i32.add
    local.set $dtos_0_offset

    i32.const 0
    local.set $dtos__for2_i
    (loop $loop2
      local.get $dtos_0_fract_part
      f64.const 10.0
      f64.mul
      local.set $dtos_0_fract_part
      local.get $dtos_0_fract_part
      call $dtoi
      local.set $dtos__for2_digit
      i32.const 48
      local.get $dtos__for2_digit
      i32.add
      local.get $dtos_0_offset
      local.get $dtos_0_result
      call $i32_set_array_elem
      local.get $dtos_0_fract_part
      local.get $dtos__for2_digit
      call $itod
      f64.sub
      local.set $dtos_0_fract_part
      local.get $dtos_0_offset
      i32.const 1
      i32.add
      local.set $dtos_0_offset
      local.get $dtos__for2_i
      i32.const 1
      i32.add
      local.set $dtos__for2_i
      local.get $dtos__for2_i
      local.get $dtos_0_precision
      i32.lt_s
      br_if $loop2
    )

    local.get $tmpString
    call $delete_string

    local.get $dtos_0_result
    call $array_int_to_string
    return
    i32.const 0
    return
  )
  
  (func $stod (param $stod_0_str i32) (result f64)
   (local $stod_0_int_arr i32)
   (local $stod_0_is_neg i32)
   (local $stod_0_found_decimal i32)
   (local $stod_0_decimal_coeff f64)
   (local $stod_0_d f64)
   (local $stod__for1_i i32)

    local.get $stod_0_str
    call $string_to_array_int
    local.set $stod_0_int_arr

    i32.const 0
    local.set $stod_0_is_neg

    i32.const 0
    local.set $stod_0_found_decimal

    f64.const 10.0
    local.set $stod_0_decimal_coeff

    f64.const 0.0
    local.set $stod_0_d

    i32.const 0
    local.set $stod__for1_i
    (loop $loop1
      local.get $stod__for1_i
      local.get $stod_0_int_arr
      call $i32_get_array_elem
      i32.const 45
      i32.eq
      if
        local.get $stod__for1_i
        i32.const 0
        i32.ne
        if
          i32.const 0
          call $string_ini
          call $error
        else
          i32.const 1
          local.set $stod_0_is_neg
        end
      else
        local.get $stod__for1_i
        local.get $stod_0_int_arr
        call $i32_get_array_elem
        i32.const 48
        i32.ge_s
        local.get $stod__for1_i
        local.get $stod_0_int_arr
        call $i32_get_array_elem
        i32.const 57
        i32.le_s
        i32.and
        if
          local.get $stod_0_found_decimal
          if
            local.get $stod_0_d
            local.get $stod__for1_i
            local.get $stod_0_int_arr
            call $i32_get_array_elem
            i32.const 48
            i32.sub
            call $itod
            local.get $stod_0_decimal_coeff
            f64.div
            f64.add
            local.set $stod_0_d
            local.get $stod_0_decimal_coeff
            f64.const 10.0
            f64.mul
            local.set $stod_0_decimal_coeff
          else
            local.get $stod_0_d
            f64.const 10.0
            f64.mul
            local.get $stod__for1_i
            local.get $stod_0_int_arr
            call $i32_get_array_elem
            i32.const 48
            i32.sub
            call $itod
            f64.add
            local.set $stod_0_d
          end
        else
          local.get $stod__for1_i
          local.get $stod_0_int_arr
          call $i32_get_array_elem
          i32.const 46
          i32.eq
          if
            local.get $stod_0_found_decimal
            if
              i32.const 0
              call $string_ini
              call $error
            else
              i32.const 1
              local.set $stod_0_found_decimal
            end
          else
            i32.const 0
            call $string_ini
            call $error
          end
        end
      end
      local.get $stod__for1_i
      i32.const 1
      i32.add
      local.set $stod__for1_i
      local.get $stod__for1_i
      local.get $stod_0_int_arr
      call $length
      i32.lt_s
      br_if $loop1
    )

    local.get $stod_0_is_neg
    if
      local.get $stod_0_d
      f64.const 0.0
      f64.const 1.0
      f64.sub
      f64.mul
      local.set $stod_0_d
    end

    local.get $stod_0_d
    return
    f64.const 0
    return
  )
  
  (func $stoi (param $stoi_0_str i32) (result i32)
    local.get $stoi_0_str
    call $stod
    call $dtoi
    return
  )

  (func $get (param $get_0_index i32) (param $get_0_str i32) (result i32)
   (local $get_0_arr_int i32)
   (local $get_0_result_int i32)

    local.get $get_0_str
    call $string_to_array_int
    local.set $get_0_arr_int

    i32.const 1
    call $i32_new_array
    local.set $get_0_result_int

    local.get $get_0_index
    local.get $get_0_arr_int
    call $i32_get_array_elem
    i32.const 0
    local.get $get_0_result_int
    call $i32_set_array_elem

    local.get $get_0_result_int
    call $array_int_to_string
    return
    i32.const 0
    return
  )
  
  (func $delete_struct (param $delete_struct0_struct_pointer i32)
   (local $delete_struct0_length i32)

    local.get $delete_struct0_struct_pointer
    i32.const 4
    i32.sub
    i32.load
    local.set $delete_struct0_length

    local.get $delete_struct0_struct_pointer
    i32.const 4
    i32.sub
    local.get $delete_struct0_length
    i32.const 4
    i32.add
    call $deallocate_memory
    i32.const 0
    return
  )

  
  (func $print_bool (param $print_bool0_value i32)

    local.get $print_bool0_value
    i32.const 0
    i32.eq
    if
      i32.const 5
      call $string_ini
      i32.const 0
      i32.const 102
      call $string_ini_assign
      i32.const 1
      i32.const 97
      call $string_ini_assign
      i32.const 2
      i32.const 108
      call $string_ini_assign
      i32.const 3
      i32.const 115
      call $string_ini_assign
      i32.const 4
      i32.const 101
      call $string_ini_assign
      call $print_string
    else
      i32.const 4
      call $string_ini
      i32.const 0
      i32.const 116
      call $string_ini_assign
      i32.const 1
      i32.const 114
      call $string_ini_assign
      i32.const 2
      i32.const 117
      call $string_ini_assign
      i32.const 3
      i32.const 101
      call $string_ini_assign
      call $print_string
    end
    i32.const 0
    return
  )

  (func $print_int (param $print_int0_value i32)
    (local $tmpString i32)
    local.get $print_int0_value
    
    call $itos
    local.tee $tmpString
    
    call $print
    
    local.get $tmpString
    call $delete_string
  )

  (func $print_double (param $print_double0_value f64)
    (local $tmpString i32)
    local.get $print_double0_value
    
    call $dtos
    local.tee $tmpString
    
    call $print
    
    local.get $tmpString
    call $delete_string
  )

  (func $print_string (param $print_string0_value i32)
    local.get $print_string0_value
    call $print
    local.get $print_string0_value
    call $delete_string
  )
  
  (func $i32_set_array_elem (param $value i32) (param $index i32) (param $arr i32) 
    local.get $arr
    call $check_if_null
    local.get $index
    call $check_in_bounds
    
    local.get $index
    i32.const 4
    i32.mul
    local.get $arr
    i32.add
    local.get $value
    i32.store
  )

  (func $i32_set_array_elem_alt (param $value i32) (param $arr i32) (param $index i32)   
    local.get $value
    local.get $index
    local.get $arr
    call $check_if_null
    call $i32_set_array_elem
  )
  
  (func $i32_get_array_elem (param $index i32) (param $arr i32) (result i32)
    local.get $arr
    local.get $index
    call $check_in_bounds
    
    local.get $index
    i32.const 4
    i32.mul
    local.get $arr
    i32.add
    i32.load
    return
  )
  
  (func $i32_get_array_elem_alt (param $arr i32) (param $index i32) (result i32)
    local.get $index
    local.get $arr
    call $i32_get_array_elem
  )
  
  (func $i32_new_array (param $size i32) (result i32)
   (local $index i32)
    local.get $size
    i32.const 4
    i32.mul
    i32.const 4
    i32.add
    call $allocate_memory
    i32.const 4
    i32.add
    local.set $index

    local.get $index
    i32.const 4
    i32.sub
    local.get $size
    i32.store

    local.get $index
    return
  )
  
  (func $f32_set_array_elem (param $value f32) (param $index i32) (param $arr i32) 
    local.get $arr
    call $check_if_null
    local.get $index
    call $check_in_bounds
    
    local.get $index
    i32.const 4
    i32.mul
    local.get $arr
    i32.add
    local.get $value
    f32.store
  )

  (func $f32_set_array_elem_alt (param $value f32) (param $arr i32) (param $index i32)   
    local.get $value
    local.get $index
    local.get $arr
    call $check_if_null
    call $f32_set_array_elem
  )
  
  (func $f32_get_array_elem (param $index i32) (param $arr i32) (result f32)
    local.get $arr
    local.get $index
    call $check_in_bounds
    
    local.get $index
    i32.const 4
    i32.mul
    local.get $arr
    i32.add
    f32.load
    return
  )
  
  (func $f32_get_array_elem_alt (param $arr i32) (param $index i32) (result f32)
    local.get $index
    local.get $arr
    call $f32_get_array_elem
  )
  
  (func $f32_new_array (param $size i32) (result i32)
   (local $index i32)
    local.get $size
    i32.const 4
    i32.mul
    i32.const 4
    i32.add
    call $allocate_memory
    i32.const 4
    i32.add
    local.set $index

    local.get $index
    i32.const 4
    i32.sub
    local.get $size
    i32.store

    local.get $index
    return
  )
  
  (func $f64_set_array_elem (param $value f64) (param $index i32) (param $arr i32) 
    local.get $arr
    call $check_if_null
    local.get $index
    call $check_in_bounds
    
    local.get $index
    i32.const 8
    i32.mul
    local.get $arr
    i32.add
    local.get $value
    f64.store
  )

  (func $f64_set_array_elem_alt (param $value f64) (param $arr i32) (param $index i32)   
    local.get $value
    local.get $index
    local.get $arr
    call $check_if_null
    call $f64_set_array_elem
  )
  
  (func $f64_get_array_elem (param $index i32) (param $arr i32) (result f64)
    local.get $arr
    local.get $index
    call $check_in_bounds
    
    local.get $index
    i32.const 8
    i32.mul
    local.get $arr
    i32.add
    f64.load
    return
  )
  
  (func $f64_get_array_elem_alt (param $arr i32) (param $index i32) (result f64)
    local.get $index
    local.get $arr
    call $f64_get_array_elem
  )
  
  (func $f64_new_array (param $size i32) (result i32)
   (local $index i32)
    local.get $size
    i32.const 8
    i32.mul
    i32.const 4
    i32.add
    call $allocate_memory
    i32.const 4
    i32.add
    local.set $index

    local.get $index
    i32.const 4
    i32.sub
    local.get $size
    i32.store

    local.get $index
    return
  )
  (func $allocate_struct (param $size i32) (result i32)
    (local $tmpOffset i32)
    local.get $size
    i32.const 4
    i32.add
    call $allocate_memory
    local.tee $tmpOffset
    
    local.get $size
    i32.store
    
    local.get $tmpOffset
    i32.const 4
    i32.add
  )
  
  (func $i32_assign_to_struct (param $value i32) (param $struct i32) (param $index i32)
    local.get $struct
    call $check_if_null
    local.get $index
    i32.add

    local.get $value
    i32.store
  )
  
  (func $f64_assign_to_struct (param $value f64) (param $struct i32) (param $index i32)
    local.get $struct
    call $check_if_null
    local.get $index
    i32.add

    local.get $value
    f64.store
  )
(export "main" (func $main_main))
(data (i32.const 8) "\03\00\00\00\3e\00\00\00\3a\00\00\00\28\00\00\00")
(data (i32.const 4) "\18\00\00\00")


  (func $main_main

    i32.const 12
    call $copy_string
    call $print_string
    i32.const 0
    return
  )

)
